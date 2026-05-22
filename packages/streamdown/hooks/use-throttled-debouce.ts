import { onUnmounted, ref, watch } from "vue";

export const useThrottledDebounce = <T>(
  value: T,
  throttleMs = 200,
  debounceMs = 50
) => {
  const processedValue = ref(value) as { value: T };
  const lastRunTime = ref(0);
  const timeoutRef = ref<number | null>(null);

  watch(
    () => value,
    (newValue) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunTime.value;

      // Clear any pending debounce
      if (timeoutRef.value) {
        window.clearTimeout(timeoutRef.value);
      }

      // If enough time has passed, run immediately (throttle)
      if (timeSinceLastRun >= throttleMs) {
        processedValue.value = newValue;
        lastRunTime.value = now;
      } else {
        // Otherwise, debounce it
        timeoutRef.value = window.setTimeout(() => {
          processedValue.value = newValue;
          lastRunTime.value = Date.now();
        }, debounceMs);
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (timeoutRef.value) {
      window.clearTimeout(timeoutRef.value);
    }
  });

  return processedValue;
};
