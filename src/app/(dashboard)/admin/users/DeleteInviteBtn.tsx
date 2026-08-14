"use client";

import {Button} from "@/components/ui/button"
import { Trash2 } from "lucide-react";
import { revokeInvitation } from "../actions";
import { toast } from "sonner";

export const DeleteInviteBtn = ( props: {InvitationId: string, emailAddress: string}) => 
    {
        const { InvitationId, emailAddress } = props;

        const handleRevokeInvitation = async () =>{
            const response = await revokeInvitation(InvitationId);
            console.log(response);

            if(response.status === "success"){
                toast(
                "Invitation Revoked", {
                    description: "The invitation has been successful revoked!"
                })} else {
                    toast("Error",{
                        description:"An error occured while revoking the invitation"
                    })
                }
        }

        return(
            <Button variant='ghost' size='icon' className=" flex  h-9 w-9 text-muted-foreground hover:text-error-50" onClick={
                () => handleRevokeInvitation()
            }>
                <Trash2 />
                <span className="sr-only">
                    Delete invite for {emailAddress}
                </span>
            </Button>
        )
    }