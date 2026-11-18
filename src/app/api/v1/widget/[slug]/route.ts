import { NextResponse } from "next/server";
import { parseSnapshot } from "@/lib/identity";
import { getProductBySlug, listWall } from "@/lib/queries";
import { logoUrl } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.isPublic) {
    return NextResponse.json({ error: "Product not found or private" }, { status: 404 });
  }

  const testimonials = (await listWall(product.id)).map((t) => {
    const snapshot = parseSnapshot(t.identitySnapshot);
    return {
      id: t.id,
      content: t.content,
      rating: t.rating ?? 5,
      author: {
        name: snapshot.display_name,
        headline: snapshot.headline,
        avatarUrl: snapshot.avatar_url,
        profileUrl: snapshot.profile_url,
        identitySource: snapshot.identity_source,
      },
      sourceType: t.sourceType,
      submittedAt: t.submittedAt,
    };
  });

  return NextResponse.json(
    {
      product: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        websiteUrl: product.websiteUrl,
        logoUrl: logoUrl(product.logoKey),
      },
      total: testimonials.length,
      testimonials,
    },
    {
      status: 200,
      headers: {
        // 60-second edge cache with stale-while-revalidate as specified in client architecture
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
