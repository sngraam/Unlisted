// Four onboarding stages: profile, workspace, brand context, marketplace connections.
export default function StepProgress({ step }: { step: number }) {
  return (
    <div className="step-progress" aria-label={"Step " + step + " of 4"}>
      {[1, 2, 3, 4].map((n) => (
        <span className={n <= step ? "done" : ""} key={n} />
      ))}
    </div>
  );
}
