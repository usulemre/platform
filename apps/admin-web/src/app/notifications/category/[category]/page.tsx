import { CategoryNotifications, type NotificationCategoryDto } from '@/modules/notification';

/** Category notifications page (Server Component). Params are async in Next 15. */
export default async function CategoryNotificationsPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const notificationCategory = category.toUpperCase() as NotificationCategoryDto;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold capitalize text-foreground">
        {category.toLowerCase()} notifications
      </h1>
      <CategoryNotifications category={notificationCategory} />
    </div>
  );
}
