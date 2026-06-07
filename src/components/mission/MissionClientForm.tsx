import React from 'react';
import { useMissionStore } from '@/store/missionStore';
import { InputField } from '@/components/ui/InputField';
import { SectionCard } from '@/components/ui/SectionCard';

export function MissionClientForm(): React.ReactElement {
  const client = useMissionStore((s) => s.mission.client);
  const updateClient = useMissionStore((s) => s.updateClient);

  return (
    <SectionCard title="Informations client" step="1">
      <InputField
        label="Nom du client / société *"
        value={client.nom}
        onChangeText={(t) => updateClient({ nom: t })}
        placeholder="Ex : DELTA POWER PROTECTION PRIVEE"
      />
      <InputField
        label="Adresse"
        value={client.adresse}
        onChangeText={(t) => updateClient({ adresse: t })}
        placeholder="42 Rue du Grand Val, 94370 Sucy-en-Brie"
        multiline
        numberOfLines={2}
      />
      <InputField
        label="Email"
        value={client.email}
        onChangeText={(t) => updateClient({ email: t })}
        placeholder="contact@exemple.fr"
        keyboardType="email-address"
      />
      <InputField
        label="SIRET"
        value={client.siret}
        onChangeText={(t) => updateClient({ siret: t })}
        placeholder="918 245 762 00001"
        keyboardType="numeric"
      />
    </SectionCard>
  );
}
