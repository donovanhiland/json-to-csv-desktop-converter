import React from 'react';
import { MdHourglassFull, MdCheck, MdFolder } from 'react-icons/md';
import { CircleLoadingSpinner } from './CircleLoadingSpinner';
import bytes from 'bytes';
import './App.css';

const secondaryText = '#686A6B';
const blue = '#21BFFF';
const green = '#BFFF21';
const dividerGray = '#7A7A7A';
const backgroundGray = '#303236';
// const error = '#FF0000';
// const pink = '##FF21BF';

const iconForStatus = (status: FileQueueItem['status']) => {
  switch (status) {
    case 'pending':
      return <MdHourglassFull size={20} />;
    case 'complete':
      return <MdCheck size={20} color={green} />;
    case 'in_progress':
      return <CircleLoadingSpinner />;
    // case 'failed':
    //   return <MdErrorOutline size={20} />;
    // no default
  }
};

const textForStatus = (status: FileQueueItem['status']) => {
  switch (status) {
    case 'pending':
      return 'File queued for processing';
    case 'in_progress':
      return 'Converting file to CSV';
    case 'complete':
      return 'File conversion successful';
    // no default
  }
};

const BaseButton = ({
  children,
  ...props
}: { children: React.ReactNode } & JSX.IntrinsicElements['button']) => {
  return (
    <button
      {...props}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: blue,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
};

const FileQueueItem = ({ file }: { file: FileQueueItem }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ width: 20 }}>{iconForStatus(file.status)}</div>
      <div style={{ marginLeft: 20, flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'baseline',
          }}
        >
          <div title={file.json.path}>{file.json.name}</div>
          <div
            style={{
              fontSize: 12,
              color: secondaryText,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {bytes(file.json.size)}
          </div>
        </div>

        <div
          style={{
            fontSize: 12,
            color: secondaryText,
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          {textForStatus(file.status)}
        </div>
      </div>
      <div style={{ width: 20 }}>
        {file.status === 'complete' && (
          <BaseButton
            title="Open file location"
            style={{ color: blue }}
            onClick={() =>
              window.electron.ipcRenderer.sendMessage('open-file', {
                path: file.csv.path,
              })
            }
          >
            <MdFolder size={20} color={blue} />
          </BaseButton>
        )}
      </div>
    </div>
  );
};

type JsonFile = {
  name: string;
  path: string;
  size: number;
};

type PendingFileQueueItem = {
  id: string;
  status: 'pending';
  json: JsonFile;
};

type InProgressFileQueueItem = {
  id: string;
  status: 'in_progress';
  json: JsonFile;
  csv: {
    name: string;
    path: string;
  };
};

type CompleteFileQueueItem = {
  id: string;
  status: 'complete';
  json: JsonFile;
  csv: {
    name: string;
    path: string;
    size: number;
  };
};

type FileQueueItem =
  | PendingFileQueueItem
  | InProgressFileQueueItem
  | CompleteFileQueueItem;

type State = {
  fileQueue: FileQueueItem[];
  isDragging: boolean;
};

type FileQueued = {
  type: 'QUEUED_FILES';
  payload: { files: PendingFileQueueItem[] };
};

type FileConversionStarted = {
  type: 'FILE_CONVERSION_STARTED';
  payload: {
    id: string;
    csv: {
      name: string;
      path: string;
    };
  };
};

type FileConversionComplete = {
  type: 'FILE_CONVERSION_COMPLETE';
  payload: {
    id: string;
    csv: {
      name: string;
      path: string;
      size: number;
    };
  };
};

type IsDragging = {
  type: 'IS_DRAGGING';
};

type StoppedDragging = {
  type: 'STOPPED_DRAGGING';
};

type Actions =
  | FileQueued
  | FileConversionStarted
  | FileConversionComplete
  | IsDragging
  | StoppedDragging;

const convertFileToPendingFileQueueItem = (file: File) => {
  return {
    id: `${file.path}_${String(Date.now())}`,
    status: 'pending' as const,
    json: { name: file.name, path: file.path, size: file.size },
  };
};

function reducer(state: State, action: Actions): State {
  switch (action.type) {
    case 'QUEUED_FILES': {
      const { files } = action.payload;
      return {
        ...state,
        fileQueue: state.fileQueue.concat(files),
      };
    }
    case 'FILE_CONVERSION_STARTED': {
      const { id, csv } = action.payload;
      const updateIndex = state.fileQueue.findIndex(
        (fileQueueItem) => fileQueueItem.id === id
      );

      if (updateIndex === -1) {
        return state;
      }

      const updatedItem = {
        ...state.fileQueue[updateIndex],
        status: 'in_progress' as const,
        csv,
      };
      return {
        ...state,
        fileQueue: [
          ...state.fileQueue.slice(0, updateIndex),
          updatedItem,
          ...state.fileQueue.slice(updateIndex + 1),
        ],
      };
    }
    case 'FILE_CONVERSION_COMPLETE': {
      const { id, csv } = action.payload;

      const updateIndex = state.fileQueue.findIndex(
        (fileQueueItem) => fileQueueItem.id === id
      );

      if (updateIndex === -1) {
        return state;
      }

      const updatedItem = {
        ...state.fileQueue[updateIndex],
        status: 'complete' as const,
        csv,
      };

      return {
        ...state,
        fileQueue: [
          ...state.fileQueue.slice(0, updateIndex),
          updatedItem,
          ...state.fileQueue.slice(updateIndex + 1),
        ],
      };
    }
    case 'IS_DRAGGING': {
      return {
        ...state,
        isDragging: true,
      };
    }
    case 'STOPPED_DRAGGING': {
      return {
        ...state,
        isDragging: false,
      };
    }
    default:
      throw new Error('Invalid action type');
  }
}

export default function App() {
  const [state, dispatch] = React.useReducer(reducer, {
    fileQueue: [],
    isDragging: false,
  });
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const addFilesToQueue = (newFileQueueItems: FileList | File[]) => {
    const files = Array.from(newFileQueueItems).map(
      convertFileToPendingFileQueueItem
    );
    dispatch({ type: 'QUEUED_FILES', payload: { files } });

    window.electron.ipcRenderer.sendMessage('convert-files', {
      files,
    });
  };

  const onFileChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files) {
      return;
    }

    addFilesToQueue(files);
  };

  const onDropFiles = (event: React.DragEvent) => {
    event.preventDefault();

    dispatch({ type: 'STOPPED_DRAGGING' });

    const files = Array.from(event.dataTransfer.items)
      .filter((item) => {
        const file = item.getAsFile();
        return Boolean(file?.name.endsWith('.json'));
      })
      .map((item) => item.getAsFile()) as File[];

    addFilesToQueue(files);
  };

  React.useEffect(() => {
    const listenerUnsubs = [
      window.electron.ipcRenderer.on(
        'file-queue-item-started',
        ({ id, csv }: FileConversionStarted['payload']) => {
          dispatch({ type: 'FILE_CONVERSION_STARTED', payload: { id, csv } });
        }
      ),
      window.electron.ipcRenderer.on(
        'file-queue-item-complete',
        ({ id, csv }: FileConversionComplete['payload']) => {
          dispatch({ type: 'FILE_CONVERSION_COMPLETE', payload: { id, csv } });
        }
      ),
    ];
    return () => {
      listenerUnsubs.forEach((unsub) => unsub?.());
    };
  }, []);

  const handleDragEnter = React.useCallback(() => {
    dispatch({ type: 'IS_DRAGGING' });
  }, []);

  const handleDragLeave = React.useCallback(() => {
    dispatch({ type: 'STOPPED_DRAGGING' });
  }, []);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: backgroundGray,
      }}
      onDrop={onDropFiles}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div
        style={{
          padding: '20px 20px 0px 20px',
          height: '100%',
          display: 'flex',
          flexFlow: 'column',
        }}
      >
        <div
          style={{
            height: 75,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: `1px dashed ${state.isDragging ? blue : dividerGray}`,
            borderRadius: 8,
          }}
        >
          Drag and drop files, or{' '}
          <BaseButton
            style={{ padding: '0px 6px' }}
            onClick={handleBrowseClick}
          >
            Browse
            <input
              ref={inputRef}
              hidden
              type="file"
              multiple
              accept=".json"
              onChange={onFileChanged}
            />
          </BaseButton>
        </div>

        <div
          style={{
            marginTop: 14,
            flex: 1,
            display: 'flex',
            flexFlow: 'column',
            gap: 10,
            overflowY: 'auto',
            paddingBottom: 20,
          }}
        >
          {state.fileQueue.map((file) => {
            return <FileQueueItem key={file.id} file={file} />;
          })}
        </div>
      </div>
    </div>
  );
}
