const RightAIPanel = () => {
  return (
    <aside className="hidden xl:block w-80 border-l bg-background p-4 space-y-4">
      <h2 className="text-sm font-semibold tracking-tight">AI Guardian</h2>
      <p className="text-sm text-muted-foreground">
        Context-aware suggestions will appear here. Ask anything or generate content.
      </p>
      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-2">Suggested actions</p>
          <ul className="space-y-2 text-sm">
            <li className="hover:underline cursor-pointer">Schedule 3 posts for next week</li>
            <li className="hover:underline cursor-pointer">Send follow-up email to 7 hot leads</li>
            <li className="hover:underline cursor-pointer">Generate a 30-day campaign plan</li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default RightAIPanel;
