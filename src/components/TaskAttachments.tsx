import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Link2, Upload, Download, Trash2, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskAttachment {
  id: string;
  attachment_type: 'file' | 'link';
  name: string;
  url: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

interface TaskAttachmentsProps {
  taskId: string;
}

export const TaskAttachments = ({ taskId }: TaskAttachmentsProps) => {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<TaskAttachment | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (taskId) {
      fetchAttachments();
    }
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments((data || []) as TaskAttachment[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attachments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${taskId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName);

      // Save attachment record
      const { error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          attachment_type: 'file',
          name: file.name,
          url: publicUrl,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      fetchAttachments();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLinkAdd = async () => {
    if (!linkName.trim() || !linkUrl.trim() || !user) return;

    // Ensure URL has proper protocol
    let formattedUrl = linkUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    try {
      const { error } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          attachment_type: 'link',
          name: linkName,
          url: formattedUrl
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Link added successfully",
      });

      setLinkName("");
      setLinkUrl("");
      fetchAttachments();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add link",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (attachment: TaskAttachment) => {
    setAttachmentToDelete(attachment);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!attachmentToDelete) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachmentToDelete.id);

      if (dbError) throw dbError;

      // If it's a file, also delete from storage
      if (attachmentToDelete.attachment_type === 'file') {
        const urlParts = attachmentToDelete.url.split('/');
        const filePath = urlParts.slice(-3).join('/'); // Get the user_id/task_id/filename part
        
        await supabase.storage
          .from('task-attachments')
          .remove([filePath]);
      }

      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });

      fetchAttachments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete attachment",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      if (attachment.attachment_type === 'file') {
        // For files, trigger download
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading attachments...</div>;
  }

  return (
    <div className="space-y-3 mt-6 pt-6 border-t border-border">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Paperclip className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Attachment</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Upload File</TabsTrigger>
                <TabsTrigger value="link">Add Link</TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="file-upload">Choose File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4 animate-spin" />
                      Uploading...
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="link" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="link-name">Link Name</Label>
                  <Input
                    id="link-name"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="Enter a name for this link"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <Button onClick={handleLinkAdd} className="w-full">
                  <Link2 className="h-4 w-4 mr-1" />
                  Add Link
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {attachments.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">No attachments yet</div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                  {attachment.attachment_type === 'file' ? (
                    <Paperclip className="h-4 w-4 text-primary" />
                  ) : (
                    <Link2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {attachment.file_size && (
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </span>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {attachment.attachment_type}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {attachment.attachment_type === 'link' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyLink(attachment.url)}
                    title="Copy link"
                  >
                    {copiedLink === attachment.url ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {attachment.attachment_type === 'file' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(attachment)}
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteClick(attachment)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Delete attachment"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{attachmentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};