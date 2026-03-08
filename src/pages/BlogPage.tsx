import { Link } from "react-router-dom";
import { blogArticles } from "@/data/blogArticles";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import SectionHeading from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Calendar } from "lucide-react";

const BlogPage = () => {
  return (
    <section className="container py-12">
      <PageMeta
        title="Health Blog – Medical Articles & Tips"
        description="Read expert medical articles about blood tests, thyroid disorders, diabetes, and preventive health from Emerald Medical Care's experienced pathologists."
        canonical="https://emeraldmedicalcare.com/blog"
      />

      <Breadcrumbs items={[{ label: "Health Blog" }]} />
      <SectionHeading
        title="Health Blog"
        subtitle="Expert medical articles and health tips from our experienced pathologists"
      />

      <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
        {blogArticles.map((article) => (
          <Link
            key={article.slug}
            to={`/blog/${article.slug}`}
            className="group block rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:scale-[1.01]"
          >
            <Badge variant="secondary" className="mb-3">{article.category}</Badge>
            <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              {article.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{article.description}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(article.datePublished).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>
            </div>
            <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
              Read more <ArrowRight className="ml-1 h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BlogPage;
