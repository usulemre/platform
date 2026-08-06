import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';

/** Research question panel (with economic rationale — AD-2/EXP-1). */
export function ResearchQuestionPanel({
  researchQuestion,
  economicRationale,
}: {
  researchQuestion: string;
  economicRationale: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Research question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{researchQuestion}</p>
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Economic rationale
          </h3>
          <p className="text-muted-foreground">{economicRationale}</p>
        </div>
      </CardContent>
    </Card>
  );
}
