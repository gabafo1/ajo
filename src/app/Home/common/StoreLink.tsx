
import { ArrowRightIcon } from "lucide-react";
import type { ButtonLinkProps } from "./ButtonLink";

function StoreLink({
  href,
  className,
  target,
  //upperText,
  lowerText,
}: ButtonLinkProps) {
  return (
    <a href={href} className={className} target={target}>
      <div className=" flex space-x-2">
        <p>{lowerText}</p>
        <ArrowRightIcon className="w-5" />
      </div>
    </a>
  );
}

export default StoreLink;