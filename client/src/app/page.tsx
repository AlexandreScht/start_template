'use client';

import StartGame from '@/components/buttons';
import GenerateGameId from '@/components/inputs/generate';
import { Input } from '@heroui/react';
import { useState } from 'react';

export default function Home() {
  const [players, setPlayers] = useState<string[]>([]);
  const [creator, setCreator] = useState<string | null>(null);

  return (
    <main className="absolute flex h-full w-full items-center">
      <div className="container mx-auto grid grid-cols-2 gap-12">
        <div className="bg-asset-v2 border-asset-v5 flex flex-col gap-6 rounded-xl border p-8 shadow-xl backdrop-blur-md">
          <h2 className="text-foreground text-2xl font-bold">Créer une partie</h2>
          <GenerateGameId />
          <div className="flex flex-col gap-2">
            <h3 className="text-foreground text-lg font-semibold">Joueurs ({players.length})</h3>
            {players.map((player, index) => (
              <div
                key={index}
                className="bg-background-v2/50 flex items-center justify-between rounded p-2 backdrop-blur-sm"
              >
                <span className="text-foreground">{player}</span>
                <button className="text-danger hover:text-danger-v9">Retirer</button>
              </div>
            ))}
          </div>

          <StartGame />
        </div>

        {/* Carte Rejoindre une partie */}
        <div className="bg-background/80 border-background-v4 flex flex-col gap-6 rounded-xl border p-8 shadow-xl backdrop-blur-md">
          <h2 className="text-foreground text-2xl font-bold">Rejoindre une partie</h2>

          <div className="flex gap-4">
            <Input placeholder="Identifiant de la partie" className="flex-1" />
            <button className="bg-primary hover:bg-primary-v9 rounded-lg px-4 py-2 text-white">Rejoindre</button>
          </div>

          {creator && (
            <div className="bg-background-v2/50 rounded p-4 backdrop-blur-sm">
              <h3 className="text-foreground mb-2 text-lg font-semibold">Créateur de la partie</h3>
              <p className="text-foreground">{creator}</p>
            </div>
          )}

          <button className="bg-secondary hover:bg-secondary-v11 mt-auto rounded-lg px-6 py-3 text-white">Prêt</button>
        </div>
      </div>
    </main>
  );
}
