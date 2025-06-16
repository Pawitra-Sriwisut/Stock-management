import React from "react";
import { Spin } from "antd";

const Loading: React.FC = () => (
  <div className="centered-container">
    <Spin size="large" />
  </div>
);

export default Loading;
