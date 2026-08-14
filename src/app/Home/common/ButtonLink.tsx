export interface ButtonLinkProps {
  href: string;
  children?: React.ReactNode;
  className?: string;
  target?: string;
  logo?: string;
  upperText?: string;
  lowerText?: string;
}

function ButtonLink({ href, children, className, target }: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target={target}
    >
      {children}
    </a>
  );
}

export default ButtonLink;
