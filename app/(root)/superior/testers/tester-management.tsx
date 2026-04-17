"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  RefreshCw,
  Mail,
  User,
  Clock,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  addTester,
  removeTester,
  listTesters,
  resendTesterInvite,
} from "@/actions/superior";

interface Tester {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  invitedBy: string | null;
}

export function TesterManagement() {
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTesterName, setNewTesterName] = useState("");
  const [newTesterEmail, setNewTesterEmail] = useState("");

  const fetchTesters = async () => {
    setLoading(true);
    const result = await listTesters();
    if (result.testers) {
      setTesters(result.testers);
    }
    if (result.error) {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTesters();
  }, []);

  const handleAddTester = () => {
    if (!newTesterName.trim() || !newTesterEmail.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    startTransition(async () => {
      const result = await addTester({
        email: newTesterEmail.trim(),
        name: newTesterName.trim(),
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        setNewTesterName("");
        setNewTesterEmail("");
        setIsAddOpen(false);
        fetchTesters();
      }
    });
  };

  const handleRemoveTester = (userId: string) => {
    startTransition(async () => {
      const result = await removeTester(userId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        fetchTesters();
      }
    });
  };

  const handleResendInvite = (userId: string) => {
    startTransition(async () => {
      const result = await resendTesterInvite(userId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.success);
        fetchTesters();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back button and Add tester */}
      <div className="flex items-center justify-between">
        <Link href="/superior">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Tester
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tester</DialogTitle>
              <DialogDescription>
                Enter the tester&apos;s details. They will receive an email with
                temporary credentials and will be required to change their
                password on first login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newTesterName}
                  onChange={(e) => setNewTesterName(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={newTesterEmail}
                  onChange={(e) => setNewTesterEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleAddTester} disabled={isPending}>
                {isPending ? "Adding..." : "Add & Send Invite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            Tester Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div>
              <p className="text-sm text-foreground">Total Testers</p>
              <p className="text-2xl font-bold">{testers.length}</p>
            </div>
            <div>
              <p className="text-sm text-foreground">Pending Password Change</p>
              <p className="text-2xl font-bold">
                {testers.filter((t) => t.mustChangePassword).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground">Active</p>
              <p className="text-2xl font-bold">
                {testers.filter((t) => !t.mustChangePassword).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">All Testers</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTesters}
            disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-foreground">
              Loading testers...
            </div>
          ) : testers.length === 0 ? (
            <div className="text-center py-8 text-foreground">
              <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No testers added yet</p>
              <p className="text-sm">
                Click &quot;Add Tester&quot; to invite someone
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Name</TableHead>
                    <TableHead className="text-foreground">Email</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Added</TableHead>
                    <TableHead className="text-foreground">
                      Last Login
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testers.map((tester) => (
                    <TableRow key={tester.id}>
                      <TableCell className="font-medium">
                        {tester.name || "—"}
                      </TableCell>
                      <TableCell>{tester.email || "—"}</TableCell>
                      <TableCell>
                        {tester.mustChangePassword ? (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {new Date(tester.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {tester.lastLoginAt
                          ? new Date(tester.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tester.mustChangePassword && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvite(tester.id)}
                              disabled={isPending}>
                              <Mail className="w-3 h-3 mr-1" />
                              Resend
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isPending}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Tester
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  <strong>{tester.name || tester.email}</strong>
                                  ? This will permanently delete their account
                                  and revoke documentation access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveTester(tester.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
