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
    max-width: 400px;
    width: fit-content;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    background-color: ${type === 'alert' ? '#f8d7da' : '#d4edda'};
    color: ${type === 'alert' ? '#721c24' : '#155724'};
    text-align: center;
    display: flex;
    gap: 16px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    box-sizing: border-box;
    margin: 0 auto;
  `;

  return (
    <div css={commonStyle}>
      <div>{content}</div>
    </div>
  );
};

export default NotiTemplate;
