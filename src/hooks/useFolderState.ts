import { useCallback } from 'react';
import { useFileSidebar } from '~/contexts/FileSidebarContext';

export function useFolderState(folderId: string) {
  const { folderStates, setFolderState } = useFileSidebar();
  
  const isExpanded = folderStates[folderId] ?? false;
  
  const toggleExpanded = useCallback(() => {
    setFolderState(folderId, !isExpanded);
  }, [folderId, isExpanded, setFolderState]);
  
  const setExpanded = useCallback((expanded: boolean) => {
    setFolderState(folderId, expanded);
  }, [folderId, setFolderState]);

  const openFolder = useCallback(() => {
    setFolderState(folderId, true);
  }, [folderId, setFolderState]);

  const closeFolder = useCallback(() => {
    setFolderState(folderId, false);
  }, [folderId, setFolderState]);
  
  return {
    isExpanded,
    toggleExpanded,
    setExpanded,
    openFolder,
    closeFolder,
  };
}
