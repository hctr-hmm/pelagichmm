import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useQuery } from '@tanstack/react-query';
import { getApi } from '../api/getApi';
import { getRetryConfig } from '../utils/authErrorHandler';

export function useThemeSongs(itemId: string | null | undefined, userId?: string, enabled = true) {
    return useQuery<BaseItemDto[]>({
        queryKey: ['themeSongs', itemId, userId],
        queryFn: async () => {
            const response = await getLibraryApi(getApi()).getThemeSongs({
                itemId: itemId!,
                userId,
                inheritFromParent: true,
            });

            return response.data.Items ?? [];
        },
        enabled: enabled && !!itemId,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        ...getRetryConfig(),
    });
}
