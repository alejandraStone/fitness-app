import { Screen } from '../../shared/ui/Screen';
import { EmptyState } from '../../shared/ui/EmptyState';

/** Temporary destination until the Progression feature is specified. */
export default function ProgressScreen() {
  return (
    <Screen edges={['left', 'right']}>
      <EmptyState
        message="Aquí podrás consultar tu progreso cuando el seguimiento de entrenamientos esté disponible."
        title="Disponible próximamente"
      />
    </Screen>
  );
}
