const RightAIPanel = () => {
  return (
    <aside className="hidden xl:block w-80 border-l bg-background p-4 space-y-4">
      <h2 className="text-sm font-semibold tracking-tight">AI Guardian</h2>
      <p className="text-sm text-muted-foreground">
        Context-aware suggestions will appear here. Ask anything or generate content.
      </p>
    </aside>
  );
};

export default RightAIPanel;
