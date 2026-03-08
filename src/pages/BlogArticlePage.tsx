import { useParams } from "react-router-dom";
import { blogArticles } from "@/data/blogArticles";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import JsonLd, { createArticleSchema } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, UserCheck } from "lucide-react";
import NotFound from "./NotFound";

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = blogArticles.find((a) => a.slug === slug);

  if (!article) return <NotFound />;

  const schema = createArticleSchema({
    title: article.title,
    description: article.description,
    slug: article.slug,
    datePublished: article.datePublished,
    author: article.author,
  });

  return (
    <article className="container py-12 max-w-3xl mx-auto">
      <PageMeta
        title={article.title}
        description={article.description}
        canonical={`https://emeraldmedicalcare.com/blog/${article.slug}`}
      />
      <JsonLd schema={schema} />

      <Breadcrumbs items={[{ label: "Health Blog", href: "/blog" }, { label: article.title }]} />

      <header className="mb-8">
        <Badge variant="secondary" className="mb-3">{article.category}</Badge>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
          {article.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(article.datePublished).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {article.readTime}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
          <UserCheck className="h-4 w-4" /> {article.author}, {article.authorCredentials}
        </p>
      </header>

      <div
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
};

export default BlogArticlePage;
