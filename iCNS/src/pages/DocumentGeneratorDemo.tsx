import { DocumentGenerator } from "@/components/documents/DocumentGenerator";
import { DocumentHistory } from "@/components/documents/DocumentHistory";

export default function DocumentGeneratorDemo() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Générateur de Documents</h1>
        <p className="text-muted-foreground">
          Créez des documents officiels avec templates professionnels et sauvegarde automatique
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <DocumentGenerator />
        </div>
        <div>
          <DocumentHistory />
        </div>
      </div>
    </div>
  );
}
