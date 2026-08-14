"use client";

import { useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type setRole } from '../actions';
import { toast } from "sonner";

type SetRoleResult = Awaited<ReturnType<typeof setRole>>;

export const UpdateRoleForm = ({
  role,
  setRoleAction,
  userId,
}: {
  role: string;
  setRoleAction: (formData: FormData) => Promise<SetRoleResult>;
  userId: string;
}) => {
  const [currentRole, setCurrentRole] = useState(role);
  const [isPending, startTransition] = useTransition();

  function handleChange(newRole: string) {
    const previousRole = currentRole;
    setCurrentRole(newRole); // optimistic

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("role", newRole);
        formData.append("id", userId);

        const response = await setRoleAction(formData);

        if (response?.status === "error") {
          setCurrentRole(previousRole); // revert
          toast.error(typeof response.message === "string" ? response.message : "Failed to update role");
          return;
        }

        toast.success(`Role updated to ${newRole}`);
      } catch {
        setCurrentRole(previousRole); // revert
        toast.error("Something went wrong updating the role");
      }
    });
  }

  return (
    <Select
      value={currentRole}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="member">Member</SelectItem>
      </SelectContent>
    </Select>
  );
};