import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

const Breadcrumbs = ({ items }: { items: BreadcrumbEntry[] }) => (
  <Breadcrumb className="mb-6">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to="/">Home</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      {items.map((item, i) => (
        <span key={item.label} className="contents">
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {i === items.length - 1 ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={item.href!}>{item.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        </span>
      ))}
    </BreadcrumbList>
  </Breadcrumb>
);

export default Breadcrumbs;
