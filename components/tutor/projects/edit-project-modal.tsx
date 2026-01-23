"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2, Link as LinkIcon } from "lucide-react";
import { getProjectDetails, updateProject } from "@/actions/project";
import { toast } from "sonner";

const editProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z
    .array(z.string().min(1, "Requirement cannot be empty"))
    .min(1, "At least one requirement is required"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  points: z.number().int().min(1, "Points must be at least 1"),
  isActive: z.boolean(),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any | null;
  onSuccess?: () => void;
}

export function EditProjectModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: EditProjectModalProps) {
  const [isPending, startTransition] = useTransition();
  const [requirements, setRequirements] = useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [resources, setResources] = useState<
    Array<{
      title: string;
      description?: string;
      url: string;
      type: "PDF" | "VIDEO" | "AUDIO" | "IMAGE" | "LINK" | "CODE" | "DOCUMENT";
      isPublic: boolean;
    }>
  >([]);
  const [currentResource, setCurrentResource] = useState<{
    title: string;
    description: string;
    url: string;
    type: "PDF" | "VIDEO" | "AUDIO" | "IMAGE" | "LINK" | "CODE" | "DOCUMENT";
    isPublic: boolean;
  }>({
    title: "",
    description: "",
    url: "",
    type: "LINK",
    isPublic: true,
  });

  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: [],
      difficulty: "BEGINNER",
      points: 100,
      isActive: true,
    },
  });

  useEffect(() => {
    if (project && open) {
      const projectRequirements = project.requirements || [];
      setRequirements(projectRequirements);
      form.reset({
        title: project.title || "",
        description: project.description || "",
        requirements: projectRequirements,
        difficulty: project.difficulty || "BEGINNER",
        points: project.points || 100,
        isActive: project.isActive ?? true,
      });

      getProjectDetails(project.id).then((result) => {
        if (result.project?.resources) {
          const mappedResources = result.project.resources.map((resource) => ({
            title: resource.title,
            description: resource.description || "",
            url: resource.url,
            type: resource.type,
            isPublic: resource.isPublic,
          }));
          setResources(mappedResources);
        }
      });
    }
  }, [project, open, form]);

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      const newRequirements = [...requirements, currentRequirement.trim()];
      setRequirements(newRequirements);
      form.setValue("requirements", newRequirements);
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
    form.setValue("requirements", newRequirements);
  };

  const addResource = () => {
    if (currentResource.title.trim() && currentResource.url.trim()) {
      const newResources = [...resources, { ...currentResource }];
      setResources(newResources);
      setCurrentResource({
        title: "",
        description: "",
        url: "",
        type: "LINK",
        isPublic: true,
      });
    }
  };

  const updateResourceField = (
    index: number,
    field: "title" | "description" | "url" | "type" | "isPublic",
    value: string | boolean
  ) => {
    const updated = [...resources];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setResources(updated);
  };

  const removeResource = (index: number) => {
    const newResources = resources.filter((_, i) => i !== index);
    setResources(newResources);
  };

  const onSubmit = (data: EditProjectFormData) => {
    if (!project) return;

    startTransition(async () => {
      const result = await updateProject(project.id, {
        ...data,
        resources,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Project updated successfully!");
        onOpenChange(false);
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Edit Project
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Update project details for {project?.title || "your project"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Project Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Project title"
                      className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Project description..."
                      rows={4}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel className="text-white">Requirements</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={currentRequirement}
                  onChange={(e) => setCurrentRequirement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRequirement();
                    }
                  }}
                  placeholder="Add a requirement..."
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <Button
                  type="button"
                  onClick={addRequirement}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.map((req, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                      {req}
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="ml-2 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {form.formState.errors.requirements && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.requirements.message}
                </p>
              )}
            </div>

            {/* Resources (Optional) */}
            <div className="space-y-2">
              <FormLabel className="text-white">Resources (Optional)</FormLabel>
              <FormDescription className="text-gray-400">
                Update or add resources for this project
              </FormDescription>
              <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={currentResource.title}
                    onChange={(e) =>
                      setCurrentResource({
                        ...currentResource,
                        title: e.target.value,
                      })
                    }
                    placeholder="Resource title..."
                    className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                  />
                  <Select
                    value={currentResource.type}
                    onValueChange={(
                      value:
                        | "PDF"
                        | "VIDEO"
                        | "AUDIO"
                        | "IMAGE"
                        | "LINK"
                        | "CODE"
                        | "DOCUMENT"
                    ) =>
                      setCurrentResource({
                        ...currentResource,
                        type: value,
                      })
                    }>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10">
                      <SelectItem
                        value="LINK"
                        className="text-white hover:bg-white/10">
                        Link
                      </SelectItem>
                      <SelectItem
                        value="PDF"
                        className="text-white hover:bg-white/10">
                        PDF
                      </SelectItem>
                      <SelectItem
                        value="VIDEO"
                        className="text-white hover:bg-white/10">
                        Video
                      </SelectItem>
                      <SelectItem
                        value="AUDIO"
                        className="text-white hover:bg-white/10">
                        Audio
                      </SelectItem>
                      <SelectItem
                        value="IMAGE"
                        className="text-white hover:bg-white/10">
                        Image
                      </SelectItem>
                      <SelectItem
                        value="CODE"
                        className="text-white hover:bg-white/10">
                        Code
                      </SelectItem>
                      <SelectItem
                        value="DOCUMENT"
                        className="text-white hover:bg-white/10">
                        Document
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={currentResource.url}
                  onChange={(e) =>
                    setCurrentResource({
                      ...currentResource,
                      url: e.target.value,
                    })
                  }
                  placeholder="Resource URL (e.g., https://example.com/docs)"
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <Textarea
                  value={currentResource.description}
                  onChange={(e) =>
                    setCurrentResource({
                      ...currentResource,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description (optional)..."
                  rows={2}
                  className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentResource.isPublic}
                      onChange={(e) =>
                        setCurrentResource({
                          ...currentResource,
                          isPublic: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-white/10 bg-white/5"
                    />
                    <label className="text-sm text-gray-300">
                      Make resource public
                    </label>
                  </div>
                  <Button
                    type="button"
                    onClick={addResource}
                    variant="outline"
                    disabled={
                      !currentResource.title.trim() ||
                      !currentResource.url.trim()
                    }
                    className="border-white/20 text-white hover:bg-white/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                </div>
              </div>
              {resources.length > 0 && (
                <div className="space-y-2 mt-3">
                  {resources.map((resource, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <LinkIcon className="w-4 h-4 text-neon-blue" />
                          <span className="text-white font-medium text-sm">
                            Resource {index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeResource(index)}
                          className="hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <Input
                          value={resource.title}
                          onChange={(e) =>
                            updateResourceField(index, "title", e.target.value)
                          }
                          placeholder="Resource title..."
                          className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                        />
                        <Select
                          value={resource.type}
                          onValueChange={(value) =>
                            updateResourceField(index, "type", value)
                          }>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 border-white/10">
                            <SelectItem
                              value="LINK"
                              className="text-white hover:bg-white/10">
                              Link
                            </SelectItem>
                            <SelectItem
                              value="PDF"
                              className="text-white hover:bg-white/10">
                              PDF
                            </SelectItem>
                            <SelectItem
                              value="VIDEO"
                              className="text-white hover:bg-white/10">
                              Video
                            </SelectItem>
                            <SelectItem
                              value="AUDIO"
                              className="text-white hover:bg-white/10">
                              Audio
                            </SelectItem>
                            <SelectItem
                              value="IMAGE"
                              className="text-white hover:bg-white/10">
                              Image
                            </SelectItem>
                            <SelectItem
                              value="CODE"
                              className="text-white hover:bg-white/10">
                              Code
                            </SelectItem>
                            <SelectItem
                              value="DOCUMENT"
                              className="text-white hover:bg-white/10">
                              Document
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        value={resource.url}
                        onChange={(e) =>
                          updateResourceField(index, "url", e.target.value)
                        }
                        placeholder="Resource URL"
                        className="bg-white/5 border-white/10 text-white placeholder-gray-400"
                      />
                      <Textarea
                        value={resource.description || ""}
                        onChange={(e) =>
                          updateResourceField(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Description (optional)..."
                        rows={2}
                        className="bg-white/5 border-white/10 text-white placeholder-gray-400 mt-3"
                      />
                      <div className="flex items-center space-x-2 mt-3">
                        <input
                          type="checkbox"
                          checked={resource.isPublic}
                          onChange={(e) =>
                            updateResourceField(
                              index,
                              "isPublic",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 rounded border-white/10 bg-white/5"
                        />
                        <label className="text-sm text-gray-300">
                          Make resource public
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Difficulty</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-black/90 border-white/10">
                        <SelectItem
                          value="BEGINNER"
                          className="text-white hover:bg-white/10">
                          Beginner
                        </SelectItem>
                        <SelectItem
                          value="INTERMEDIATE"
                          className="text-white hover:bg-white/10">
                          Intermediate
                        </SelectItem>
                        <SelectItem
                          value="ADVANCED"
                          className="text-white hover:bg-white/10">
                          Advanced
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Points</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-white">Active</FormLabel>
                    <FormDescription className="text-gray-400">
                      Active projects are visible to students
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 rounded border-white/10 bg-white/5"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-neon-green to-emerald-400 text-white">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
