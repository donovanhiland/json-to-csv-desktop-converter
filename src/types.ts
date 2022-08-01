export type HandleableFile = {
  name: string;
  path: string;
  size?: number;
};

export type FileQueueItem = {
  status: 'pending' | 'in_progress' | 'complete' | 'failed';
  id: string;
  json: HandleableFile;
  csv?: HandleableFile;
};
