import { useState } from 'react';
import type { GameEntity, DroneLink } from '../types/save.types';
import { ProductionTable } from '../components/table/ProductionTable';
import { MiniMap } from '../components/table/MiniMap';
import { EntityDetailTable } from '../components/table/EntityDetailTable';
import styles from './ProductionPage.module.css';

interface Props {
  entities: GameEntity[];
  links: DroneLink[];
}

export function ProductionPage({ entities, links }: Props): JSX.Element {
  const [selectedEntity, setSelectedEntity] = useState<GameEntity | null>(null);

  return (
    <div className={styles.page}>
      <div className={styles.tablePanel}>
        <ProductionTable
          entities={entities}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
        />
      </div>
      <div className={styles.sidePanel}>
        <MiniMap
          entities={entities}
          links={links}
          selectedEntity={selectedEntity}
        />
        <EntityDetailTable
          entity={selectedEntity}
          links={links}
        />
      </div>
    </div>
  );
}
