import { createContext, useState } from "react";

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);

  return (
    <InterviewContext.Provider
      value={{ isLoading, setIsLoading, report, setReport, reports, setReports }}
    >
      {children}
    </InterviewContext.Provider>
  );
};
