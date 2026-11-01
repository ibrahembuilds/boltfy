import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudienceTab } from "@/components/subscribers/AudienceTab";
import { ResponsesTab } from "@/components/subscribers/ResponsesTab";
import { Inbox, Users } from "lucide-react";

export default function Subscribers() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Subscribers</h1>
          <p className="text-muted-foreground mt-1">
            The people you email, and everything they've submitted through your forms
          </p>
        </div>

        <Tabs defaultValue="audience" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="audience" className="gap-2">
              <Users className="h-4 w-4" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger value="responses" className="gap-2">
              <Inbox className="h-4 w-4" />
              Form responses
            </TabsTrigger>
          </TabsList>
          <TabsContent value="audience" className="animate-fade-in">
            <AudienceTab />
          </TabsContent>
          <TabsContent value="responses" className="animate-fade-in">
            <ResponsesTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
