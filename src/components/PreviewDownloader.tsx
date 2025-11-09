import { useState, useEffect } from "react";

interface PreviewDownloaderProps {
  fileBlob: Blob;
  fileName: string;
  onClose?: () => void;
}

export default function PreviewDownloader({ 
  fileBlob, 
  fileName,
  onClose 
}: PreviewDownloaderProps) {
  const [visible, setVisible] = useState(true);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(fileBlob);
    setFileURL(url);
    setFileType(fileBlob.type);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [fileBlob]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        const file = new File([fileBlob], fileName, { type: fileBlob.type });
        await navigator.share({
          title: "자세 리포트 공유",
          files: [file],
        });
      } else {
        alert("공유 기능을 지원하지 않는 기기예요 ㅠ");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("공유 실패:", err);
        alert("공유 중 오류가 발생했습니다.");
      }
    }
  };

  if (!visible || !fileURL) return null;

  const isPDF = fileType === "application/pdf" || fileName.endsWith(".pdf");
  const isImage = fileType.startsWith("image/") || 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center p-4 z-50">
      {/* PDF / 이미지 미리보기 */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        {isPDF ? (
          <iframe
            src={fileURL}
            className="w-full h-[70vh] border-0"
            title="PDF 미리보기"
          />
        ) : isImage ? (
          <img
            src={fileURL}
            alt="이미지 미리보기"
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        ) : (
          <div className="w-full h-[70vh] flex items-center justify-center bg-gray-100">
            <p className="text-gray-600">미리보기를 지원하지 않는 파일 형식입니다.</p>
          </div>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3 mt-4 w-full max-w-4xl justify-center flex-wrap">
        {/* 저장하기 */}
        <a
          href={fileURL}
          download={fileName}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors"
        >
          저장하기
        </a>

        {/* 공유하기 (모바일 전용) */}
        {navigator.share && (
          <button
            onClick={handleShare}
            className="px-5 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors"
          >
            공유하기
          </button>
        )}

        {/* 닫기 */}
        <button
          onClick={handleClose}
          className="px-5 py-3 bg-gray-600 text-white rounded-xl font-bold shadow-md hover:bg-gray-700 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

