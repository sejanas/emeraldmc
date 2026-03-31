import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { blogArticles } from "@/data/blogArticles";
import { useBlogs } from "@/hooks/useBlogs";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageMeta from "@/components/PageMeta";
import SectionHeading from "@/components/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Calendar, ExternalLink } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const BlogPage = () => {
  const { data: dbBlogs } = useBlogs();

  // Use DB blogs if available, fall back to static data
  const blogs = (dbBlogs && dbBlogs.length > 0)
    ? dbBlogs.map((b: any) => ({
        slug: b.slug,
        title: b.title,
        description: b.excerpt || b.meta_description || "",
        datePublished: b.published_at || b.created_at,
        author: b.author || "",
        category: b.category || "",
        readTime: b.read_time || "",
        external_url: b.external_url,
        featured_image: b.featured_image,
      }))
    : blogArticles.map((a) => ({
        slug: a.slug,
        title: a.title,
        description: a.description,
        datePublished: a.datePublished,
        author: a.author,
        category: a.category,
        readTime: a.readTime,
        external_url: null,
        featured_image: null,
      }));

  return (
    <section className="container py-12">
      <PageMeta
        title="Health Blog – Medical Articles & Tips"
        description="Read expert medical articles about blood tests, thyroid disorders, diabetes, and preventive health from our experienced pathologists."
        canonical="https://emeraldmc.lovable.app/blog"
      />
      <Breadcrumbs items={[{ label: "Health Blog" }]} />
      <SectionHeading title="Health Blog" subtitle="Expert medical articles and health tips from our experienced pathologists" />

      <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
        {blogs.map((article: any, i: number) => (
          <motion.div key={article.slug} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
            {article.external_url ? (
              <a href={article.external_url} target="_blank" rel="noopener noreferrer"
                className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:card-shadow-hover hover:scale-[1.01]">
                {article.featured_image && <img src={article.featured_image} alt={article.title} className="w-full h-48 object-cover" loading="lazy" />}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{article.category || "Article"}</Badge>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{article.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 text-justify">{article.description}</p>
                </div>
              </a>
            ) : (
              <Link to={`/blog/${article.slug}`}
                className="group block rounded-xl border border-border bg-card overflow-hidden transition-all hover:card-shadow-hover hover:scale-[1.01]">
                {article.featured_image && <img src={article.featured_image} alt={article.title} className="w-full h-48 object-cover" loading="lazy" />}
                <div className="p-6">
                  <Badge variant="secondary" className="mb-3">{article.category || "Article"}</Badge>
                  <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{article.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 text-justify">{article.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    {article.datePublished && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(article.datePublished).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    {article.readTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>}
                  </div>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Read more <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default BlogPage;
