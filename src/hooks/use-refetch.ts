import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

const useRefetch = () => {
    const queryClient = useQueryClient();
   return async () => {
    await queryClient.refetchQueries(
        {
            type: 'active',
        }
    );
   }
}
// this hook is used to refetch the queries when the project is changed eg  when the new project is selected or the project is deleted or created
export default useRefetch;