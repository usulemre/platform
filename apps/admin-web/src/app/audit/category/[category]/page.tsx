import { CategoryActivity, type EventCategoryDto } from '@/modules/audit';

/** Category activity page (Server Component) — audit events for one category
 *  (User / Agent / Workflow / … / Governance). Params are async in Next 15. */
export default async function CategoryActivityPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const eventCategory = category.toUpperCase() as EventCategoryDto;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold capitalize text-foreground">
        {category.toLowerCase()} activity
      </h1>
      <CategoryActivity category={eventCategory} />
    </div>
  );
}
