import React from "react";
import { css } from "@emotion/react";

interface NotiTemplateProps {
  type: 'alert' | 'ok';
  content: React.ReactNode;
}

const NotiTemplate: React.FC<NotiTemplateProps> = ({ type, content }) => {

  const commonStyle = css`
    display: flex;
    align-items: center;
    width: 100%;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    background-color: ${type === 'alert' ? '#f8d7da' : '#d4edda'};
    color: ${type === 'alert' ? '#721c24' : '#155724'};
    gap: 16px;
    box-sizing: border-box;
  `;

  const iconStyle = css`
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${type === 'alert' ? '#f5c6cb' : '#c3e6cb'};
    border-radius: 50%;
    font-size: 24px;
    color: ${type === 'alert' ? '#721c24' : '#155724'};
  `;

  const contentStyle = css`
    flex: 1;
    display: flex;
    flex-direction: column;
    word-wrap: break-word;
    font-size: 16px;
    line-height: 1.5;
  `;

  const data: { [prop: string]: JSX.Element } = {
    alert: (
      <div css={commonStyle}>
        <div css={iconStyle}>
          {/* 경고 아이콘 또는 원하는 아이콘으로 교체 */}
          {/* <FaExclamationTriangle size={24} /> 아이콘 라이브러리 사용 시 */}
        </div>
        <div css={contentStyle}>
          {content}
        </div>
      </div>
    ),
    ok: (
      <div css={commonStyle}>
        <div css={iconStyle}>
        {/* 확인 아이콘 또는 원하는 아이콘으로 교체 */}
          {/* <FaCheckCircle size={24} /> 아이콘 라이브러리 사용 시 */}
        </div>
        <div css={contentStyle}>
          {content}
        </div>
      </div>
    ),
  };

  return data[type] || null;
};

export default NotiTemplate;
