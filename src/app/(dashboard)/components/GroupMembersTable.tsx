import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  
  type GroupMember = {
    userId: string;
    firstName: string;
    lastName: string;
    groupName: string;
    phone: string | null;
  };
  
  export function GroupMembersTable({ data }: { data: GroupMember[] }) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>User ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                No members found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((member) => (
              <TableRow key={member.userId}>
                <TableCell className="font-medium">
                  {member.firstName} {member.lastName}
                </TableCell>
                <TableCell>{member.groupName}</TableCell>
                <TableCell>{member.phone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs font-mono truncate max-w-[120px]">
                  {member.userId}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  }