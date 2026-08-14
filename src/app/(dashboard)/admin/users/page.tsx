import {
  getUserList,
  setRole,
  removeRole,
  deleteUser,
  getInvitations,
  listGroupsForInvite,
  listPendingGroupInvites,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Trash2, UserMinus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UpdateRoleForm } from "./UpdateRoleForm";
import { DeleteInviteBtn } from "./DeleteInviteBtn";
import Image from "next/image";
import { SendInviteForm } from "./SendInviteForm";
import { SendGroupInviteForm } from "./SendGroupInviteForm";

export default async function Page() {
  const users = await getUserList();
  const invitations = await getInvitations();
  const groupsForInvite = await listGroupsForInvite();
  const pendingGroupInvites = await listPendingGroupInvites();
  const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  return (
    <div className="w-full space-y-10 p-6 md:p-8 lg:p-10">
      {/* Members Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage roles of existing members. As an admin, you can add, edit, or delete users.
          </p>
          <SendInviteForm />
        </div>
        <div className="lg:col-span-2">
          <ul className="space-y-4">
            {users.map((user, index) => (
              <div key={user.id}>
                <li className="flex flex-col space-y-4 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4 transition-shadow hover:shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="relative h-10 w-10">
                      <Image
                        src={user.imageUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>

                    <div>
                      <p className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UpdateRoleForm
                      role={user.publicMetadata?.role as string || "user"}
                      setRoleAction={setRole}
                      userId={user.id}
                    />

                    {/* Remove Role */}
                    <form
                      action={async () => {
                        "use server";
                        const formData = new FormData();
                        formData.append("id", user.id);
                        await removeRole(formData);
                      }}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        title="Remove role"
                        className="h-9 w-9 text-muted-foreground hover:text-yellow-500 transition-colors"
                      >
                        <UserMinus />
                      </Button>
                    </form>

                    {/* Delete User */}
                    <form
                      action={async () => {
                        "use server";
                        const formData = new FormData();
                        formData.append("id", user.id);
                        await deleteUser(formData);
                      }}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        title="Delete user"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 />
                      </Button>
                    </form>
                  </div>
                </li>
                {index !== users.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </ul>
        </div>
      </div>

      <Separator className="my-6" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Group invites (Ajo)
          </h3>
          <p className="text-sm text-muted-foreground">
            Invite a person to a specific savings group. They open the link (or
            paste the invite ID on{" "}
            <span className="font-medium text-foreground">Join an Ajo</span>) and
            accept while signed in with the invited email.
          </p>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <SendGroupInviteForm groups={groupsForInvite} />
          {pendingGroupInvites.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Pending group invites
              </h4>
              <ul className="space-y-3">
                {pendingGroupInvites.map((inv) => {
                  const link = appBase
                    ? `${appBase}/ajo/join?invite=${inv.id}`
                    : `/ajo/join?invite=${inv.id}`;
                  return (
                    <li
                      key={inv.id}
                      className="rounded-lg border bg-card p-3 text-sm"
                    >
                      <p className="font-medium text-foreground">
                        {inv.groupName}
                      </p>
                      <p className="text-muted-foreground">
                        {inv.email ?? "—"}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground break-all mt-2">
                        {link}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires:{" "}
                        {inv.expiresAt
                          ? new Date(inv.expiresAt).toLocaleString()
                          : "—"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Pending Invites Section */}
      <Separator className="my-6" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Pending Invites</h3>
          <p className="text-sm text-muted-foreground">
            Invited users who haven&apos;t accepted their invitation yet.
          </p>
        </div>
        <div className="lg:col-span-2">
          <ul className="space-y-4">
            {/* START OF CORRECTION: Conditional Rendering */}
            {invitations && invitations.length > 0 ? (
              invitations.map((invitation, index) => (
                <div key={invitation.id}>
                  <li
                    className="flex flex-col space-y-4 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4 transition-shadow hover:shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{invitation.emailAddress}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DeleteInviteBtn
                        InvitationId={invitation.id}
                        emailAddress={invitation.emailAddress}
                      />
                    </div>
                  </li>
                  {/* Added Separator between invites */}
                  {index !== invitations.length - 1 && <Separator className="my-4" />}
                </div>
              ))
            ) : (
              // Display message when the array is empty
              <p className="text-muted-foreground italic p-4 border rounded-lg">
                No pending invitations found.
              </p>
            )}
            {/* END OF CORRECTION */}
          </ul>
        </div>
      </div>
    </div>
  );
}
