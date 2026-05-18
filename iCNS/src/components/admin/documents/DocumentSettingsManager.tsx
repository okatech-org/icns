import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceBrandingEditor } from './ServiceBrandingEditor';
import { DocumentTemplatesManager } from './DocumentTemplatesManager';
import { FileText, Settings, LayoutTemplate } from "lucide-react";

const SERVICES = [
    { id: 'president', name: 'Présidence de la République' },
    { id: 'admin', name: 'Administration Système' },
    { id: 'courrier', name: 'Service Courriers' },
    { id: 'reception', name: 'Service Réception' },
    { id: 'cabinet', name: 'Cabinet du Directeur' },
    { id: 'sec_gen', name: 'Secrétariat Général' },
];

export const DocumentSettingsManager = () => {
    const [selectedService, setSelectedService] = useState(SERVICES[0]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Gestion des Documents</h2>
                <p className="text-muted-foreground">
                    Personnalisez les en-têtes, pieds de page et mises en page pour chaque service.
                </p>
            </div>

            <Tabs defaultValue="branding" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="branding" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Personnalisation par Service
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2">
                        <LayoutTemplate className="h-4 w-4" />
                        Modèles de Documents
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Sidebar List of Services */}
                        <Card className="md:col-span-1 h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg">Services</CardTitle>
                                <CardDescription>Sélectionnez un service</CardDescription>
                            </CardHeader>
                            <CardContent className="p-2">
                                <div className="flex flex-col space-y-1">
                                    {SERVICES.map((service) => (
                                        <Button
                                            key={service.id}
                                            variant={selectedService.id === service.id ? "secondary" : "ghost"}
                                            className="justify-start w-full"
                                            onClick={() => setSelectedService(service)}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            {service.name}
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Editor Area */}
                        <div className="md:col-span-3">
                            <ServiceBrandingEditor
                                serviceRole={selectedService.id}
                                serviceName={selectedService.name}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="templates">
                    <DocumentTemplatesManager serviceRole={selectedService.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
