import { Stack, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import {
  RoutineForm,
  type RoutineFormHandle,
} from '../../features/routine-management/RoutineForm';
import { toRoutineFormErrors } from '../../features/routine-management/routine-form-values';
import type {
  RoutineFormSubmitResult,
  RoutineFormValues,
} from '../../features/routine-management/types';
import { useRoutineServices } from '../../providers/RoutineServicesProvider';
import { SheetHeaderAction } from '../../shared/ui/SheetHeaderAction';
import { SheetScaffold } from '../../shared/ui/SheetScaffold';

/**
 * Creates a routine with its optional recurring weekdays and first exercise.
 *
 * The form is presented as a full-height sheet. Step 1 collects the name and
 * planning; saving it opens the first exercise sheet. Saving that exercise
 * persists the routine and opens its detail. Creating a routine never assigns
 * the selected date or a one-time assignment.
 */
export default function NewRoutineScreen() {
  const router = useRouter();
  const services = useRoutineServices();
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<RoutineFormHandle>(null);

  const close = useCallback(() => {
    if (!submitting) {
      router.back();
    }
  }, [router, submitting]);

  const save = useCallback(() => {
    formRef.current?.submit();
  }, []);

  const handleSubmit = useCallback(
    async (values: RoutineFormValues): Promise<RoutineFormSubmitResult> => {
      const result = await services.createRoutine({
        name: values.name,
        weekdays: values.weekdays,
        exercises: values.exercises,
      });

      if (result.ok) {
        router.replace({
          pathname: '/routines/[id]',
          params: { id: result.routine.id },
        });
        return { ok: true };
      }

      return { ok: false, errors: toRoutineFormErrors(result.errors) };
    },
    [router, services],
  );

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: !submitting }} />
      <SheetScaffold
        dismissable={!submitting}
        headerLeft={
          <SheetHeaderAction
            disabled={submitting}
            label="Cancelar"
            onPress={close}
          />
        }
        headerRight={
          <SheetHeaderAction
            disabled={submitting}
            label="Continuar"
            loading={submitting}
            onPress={save}
            primary
          />
        }
        onClose={close}
        title="Nueva rutina"
      >
        <RoutineForm
          creationMode
          onCancel={close}
          onSubmit={handleSubmit}
          onSubmittingChange={setSubmitting}
          presentation="sheet"
          ref={formRef}
          submitLabel="Continuar"
        />
      </SheetScaffold>
    </>
  );
}
