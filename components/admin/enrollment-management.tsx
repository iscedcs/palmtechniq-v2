"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  addStudentToCourse,
  bulkAddStudentsToCourse,
} from "@/actions/admin-dashboard";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface StudentEnrollment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: Date;
  };
  enrolledAt: Date;
  status: string;
}

interface AdminEnrollmentUIProps {
  courseId: string;
  enrollments: StudentEnrollment[];
  availableStudents: Student[];
}

export default function AdminEnrollmentUI({
  courseId,
  enrollments: initialEnrollments,
  availableStudents,
}: AdminEnrollmentUIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBulkStudents, setSelectedBulkStudents] = useState<string[]>(
    [],
  );
  const [bulkSearchTerm, setBulkSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enrollments, setEnrollments] =
    useState<StudentEnrollment[]>(initialEnrollments);

  const enrolledStudentIds = new Set(enrollments.map((e) => e.user.id));

  // Filter available students - only show those not already enrolled
  const availableStudentsToAdd = useMemo(
    () => availableStudents.filter((s) => !enrolledStudentIds.has(s.id)),
    [availableStudents, enrolledStudentIds],
  );

  const filteredBulkStudents = useMemo(
    () =>
      availableStudentsToAdd.filter(
        (s) =>
          s.name.toLowerCase().includes(bulkSearchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(bulkSearchTerm.toLowerCase()),
      ),
    [availableStudentsToAdd, bulkSearchTerm],
  );

  const filteredEnrollments = enrollments.filter(
    (e) =>
      e.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }

    setIsLoading(true);
    try {
      const result = await addStudentToCourse(courseId, selectedStudentId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Student added to course successfully!");
        setSelectedStudentId("");
        setIsOpen(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error("Failed to add student");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAddStudents = async () => {
    if (selectedBulkStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setIsLoading(true);
    try {
      const result = await bulkAddStudentsToCourse(
        courseId,
        selectedBulkStudents,
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Successfully added ${result.enrolledCount} student(s) to the course`,
        );
        if (result.alreadyEnrolledCount! > 0) {
          toast.info(
            `${result.alreadyEnrolledCount} student(s) were already enrolled`,
          );
        }
        setSelectedBulkStudents([]);
        setBulkSearchTerm("");
        setIsBulkOpen(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error("Failed to bulk add students");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBulkStudent = (studentId: string) => {
    setSelectedBulkStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Manage Enrollments</h2>
          <p className="text-sm text-gray-400 mt-1">
            {enrollments.length} student{enrollments.length !== 1 ? "s" : ""}{" "}
            enrolled in this course
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsBulkOpen(true)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Add
          </Button>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-neon-blue hover:bg-neon-blue/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-dark-800 border-white/10 text-white placeholder-gray-500"
        />
      </div>

      {/* Enrollments Table */}
      <Card className="glass-card border-white/10">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">
                    Enrolled Since
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={4}
                      className="text-gray-400 text-sm text-center py-8">
                      {searchTerm
                        ? "No students found"
                        : "No students enrolled yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {enrollment.user.avatar && (
                            <img
                              src={enrollment.user.avatar}
                              alt={enrollment.user.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <span className="text-white font-medium">
                            {enrollment.user.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {enrollment.user.email}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 capitalize">
                          {enrollment.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(enrollment.enrolledAt).toLocaleDateString(
                          "en-GB",
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Single Student Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-dark-800 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Add Student to Course
            </DialogTitle>
            <DialogDescription>
              Select a student to add them to this course without payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Select Student
              </label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}>
                <SelectTrigger className="bg-dark-700 border-white/10 text-white">
                  <SelectValue placeholder="Choose a student..." />
                </SelectTrigger>
                <SelectContent className="bg-dark-700 border-white/10">
                  {availableStudentsToAdd.length === 0 ? (
                    <div className="p-2 text-center text-gray-400 text-sm">
                      {enrolledStudentIds.size === 0
                        ? "No students available"
                        : "All students already enrolled"}
                    </div>
                  ) : (
                    availableStudentsToAdd.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex flex-col">
                          <span>{student.name}</span>
                          <span className="text-xs text-gray-400">
                            {student.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={handleAddStudent}
              disabled={isLoading || !selectedStudentId}
              className="bg-neon-blue hover:bg-neon-blue/90 text-white">
              {isLoading ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Students Dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="bg-dark-800 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Bulk Add Students</DialogTitle>
            <DialogDescription>
              Select multiple students to add them to this course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={bulkSearchTerm}
                  onChange={(e) => setBulkSearchTerm(e.target.value)}
                  className="pl-10 bg-dark-700 border-white/10 text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Selected Students */}
            {selectedBulkStudents.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Selected ({selectedBulkStudents.length})
                </label>
                <div className="bg-dark-700 border border-white/10 rounded-md p-3 space-y-2">
                  {selectedBulkStudents.map((studentId) => {
                    const student = availableStudentsToAdd.find(
                      (s) => s.id === studentId,
                    );
                    return student ? (
                      <div
                        key={studentId}
                        className="flex items-center justify-between bg-dark-800 rounded p-2">
                        <div>
                          <p className="text-white text-sm">{student.name}</p>
                          <p className="text-gray-400 text-xs">
                            {student.email}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleBulkStudent(studentId)}
                          className="text-gray-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Available Students List */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Available Students
              </label>
              <div className="bg-dark-700 border border-white/10 rounded-md max-h-64 overflow-y-auto space-y-2 p-3">
                {filteredBulkStudents.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-4">
                    {bulkSearchTerm
                      ? "No students found matching your search"
                      : availableStudentsToAdd.length === 0
                        ? "All students already enrolled"
                        : "No students available"}
                  </div>
                ) : (
                  filteredBulkStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => toggleBulkStudent(student.id)}
                      className={`w-full text-left rounded p-2 transition ${
                        selectedBulkStudents.includes(student.id)
                          ? "bg-neon-blue/20 border border-neon-blue/50"
                          : "bg-dark-600 hover:bg-dark-500 border border-transparent"
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">
                            {student.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {student.email}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedBulkStudents.includes(student.id)
                              ? "bg-neon-blue border-neon-blue"
                              : "border-gray-400"
                          }`}>
                          {selectedBulkStudents.includes(student.id) && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkOpen(false);
                setSelectedBulkStudents([]);
                setBulkSearchTerm("");
              }}
              className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={handleBulkAddStudents}
              disabled={isLoading || selectedBulkStudents.length === 0}
              className="bg-neon-blue hover:bg-neon-blue/90 text-white">
              {isLoading
                ? "Adding..."
                : `Add ${selectedBulkStudents.length} Student${selectedBulkStudents.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
