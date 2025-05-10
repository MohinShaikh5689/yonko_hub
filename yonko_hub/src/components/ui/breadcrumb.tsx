import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, ...props }, ref) => (
    <nav ref={ref} aria-label="breadcrumb" className={cn("text-sm text-gray-400", className)} {...props} />
  )
)
Breadcrumb.displayName = "Breadcrumb"

interface BreadcrumbListProps extends React.HTMLAttributes<HTMLOListElement> {}

const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
)
BreadcrumbList.displayName = "BreadcrumbList"

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {}

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
)
BreadcrumbItem.displayName = "BreadcrumbItem"

interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {}

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  BreadcrumbLinkProps
>(({ className, ...props }, ref) => (
  <Link
    ref={ref}
    className={cn("transition-colors hover:text-indigo-300", className)}
    {...props}
  />
))
BreadcrumbLink.displayName = "BreadcrumbLink"

interface BreadcrumbPageProps extends React.HTMLAttributes<HTMLSpanElement> {}

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-gray-200", className)}
      {...props}
    />
  )
)
BreadcrumbPage.displayName = "BreadcrumbPage"

interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLLIElement> {}

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

interface BreadcrumbEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {}

const BreadcrumbEllipsis = ({
  className,
  ...props
}: BreadcrumbEllipsisProps) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    {/* Use three dots or an icon */}
    <span className="text-gray-400">...</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}