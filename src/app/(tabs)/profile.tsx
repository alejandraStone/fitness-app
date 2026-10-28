import { EmptyState } from '../../shared/ui/EmptyState';
import { Screen } from '../../shared/ui/Screen';

/** Temporary destination until the Profile feature is specified. */
export default function ProfileScreen() {
  return (
    <Screen edges={['left', 'right']}>
      <EmptyState
        message="Aquí podrás configurar tu perfil y tus preferencias cuando esa función esté disponible."
        title="Disponible próximamente"
      />
    </Screen>
  );
}
