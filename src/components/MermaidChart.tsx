import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
  chart: string;
  id?: string;
}

const MermaidChart: React.FC<MermaidChartProps> = ({ chart, id }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初始化 Mermaid 配置
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
      },
      gantt: {
        useMaxWidth: true,
      },
      journey: {
        useMaxWidth: true,
      },
      timeline: {
        useMaxWidth: true,
      },
      gitGraph: {
        useMaxWidth: true,
      },
      c4: {
        useMaxWidth: true,
      },
      sankey: {
        useMaxWidth: true,
      },
      xyChart: {
        useMaxWidth: true,
      },
      mindmap: {
        useMaxWidth: true,
      },
    });
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!elementRef.current || !chart.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // 清空容器
        elementRef.current.innerHTML = '';
        
        // 生成唯一 ID
        const chartId = id || `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        // 验证和渲染图表
        const isValid = await mermaid.parse(chart);
        if (!isValid) {
          throw new Error('Invalid Mermaid syntax');
        }

        const { svg } = await mermaid.render(chartId, chart);
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
          
          // 添加响应式样式
          const svgElement = elementRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';
            svgElement.style.margin = '0 auto';
          }
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render chart');
        
        // 显示错误信息和原始代码
        if (elementRef.current) {
          elementRef.current.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
              <div class="text-red-600 mb-2">
                <strong>Mermaid 渲染错误:</strong> ${err instanceof Error ? err.message : 'Unknown error'}
              </div>
              <details class="mt-2">
                <summary class="cursor-pointer text-gray-600 text-sm hover:text-gray-800">查看原始代码</summary>
                <pre class="mt-2 p-3 bg-gray-100 border border-gray-200 rounded text-xs overflow-x-auto text-gray-700"><code>${chart}</code></pre>
              </details>
            </div>
          `;
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart, id]);

  if (!chart.trim()) {
    return (
      <div className="mermaid-empty p-4 text-center text-gray-500 border border-dashed border-gray-300 rounded">
        空的 Mermaid 图表
      </div>
    );
  }

  return (
    <div className="mermaid-container my-6">
      {isLoading && (
        <div className="mermaid-loading flex items-center justify-center p-8 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          正在渲染图表...
        </div>
      )}
      
      <div
        ref={elementRef}
        className={`text-center overflow-auto ${isLoading ? 'hidden' : ''}`}
      />
    </div>
  );
};

export default MermaidChart;
