import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { blogArticles } from "@/data/blogArticles";
import { useBlogs } from "@/hooks/useBlogs";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import JsonLd, { createArticleSchema } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, UserCheck } from "lucide-react";
import NotFound from "./NotFound";

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: dbBlogs } = useBlogs();

  // Try DB first, fallback to static
  const dbArticle = (dbBlogs ?? []).find((b: any) => b.slug === slug);
  const staticArticle = blogArticles.find((a) => a.slug === slug);

  const article = dbArticle
    ? {
        slug: dbArticle.slug,
        title: dbArticle.title,
        description: dbArticle.excerpt || dbArticle.meta_description || "",
        content: dbArticle.content || "",
        datePublished: dbArticle.published_at || dbArticle.created_at,
        author: dbArticle.author || "",
        authorCredentials: dbArticle.author_credentials || "",
        category: dbArticle.category || "",
        readTime: dbArticle.read_time || "",
        featured_image: dbArticle.featured_image,
        meta_title: dbArticle.meta_title,
        meta_description: dbArticle.meta_description,
        external_url: dbArticle.external_url,
      }
    : staticArticle
    ? { ...staticArticle, featured_image: null, meta_title: null, meta_description: null, external_url: null }
    : null;

  if (!article) return <NotFound />;

  // If external URL, redirect
  if (article.external_url) {
    window.location.href = article.external_url;
    return null;
  }

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
        title={article.meta_title || article.title}
        description={article.meta_description || article.description}
        canonical={`https://emeraldmc.lovable.app/blog/${article.slug}`}
      />
      <JsonLd schema={schema} />
      <Breadcrumbs items={[{ label: "Health Blog", href: "/blog" }, { label: article.title }]} />

      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        {article.featured_image && (
          <img src={article.featured_image} alt={article.title} className="w-full h-64 object-cover rounded-xl mb-6" loading="lazy" />
        )}
        <Badge variant="secondary" className="mb-3">{article.category}</Badge>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">{article.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {article.datePublished && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(article.datePublished).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>}
          {article.readTime && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {article.readTime}</span>}
        </div>
        {article.author && (
          <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
            <UserCheck className="h-4 w-4" /> {article.author}{article.authorCredentials ? `, ${article.authorCredentials}` : ""}
          </p>
        )}
      </motion.header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-p:text-justify prose-li:text-muted-foreground prose-strong:text-foreground"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
};

export default BlogArticlePage;
