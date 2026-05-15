import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from "react-router-dom";

/** Drop-in replacement for `next/link`: uses `href` as React Router `to`. */
export type LinkProps = Omit<RouterLinkProps, "to"> & { href: string };

export function Link({ href, ...rest }: LinkProps) {
  return <RouterLink to={href} {...rest} />;
}
