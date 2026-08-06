'use client';

import { useFavorites } from '../hooks/use-workspace';
import { InfoCard, ItemList } from './workspace-atoms';

/** Favorite Research — items the researcher has starred across modules. */
export function Favorites() {
  const query = useFavorites();
  return (
    <InfoCard title="Favorites">
      <ItemList query={query} emptyLabel="No favorites yet." />
    </InfoCard>
  );
}
