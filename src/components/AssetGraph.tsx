import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { WealthStructure } from '../data/mockData';

interface Props {
  data: WealthStructure[];
}

const COLORS = ['#D4AF37', '#8c7324', '#4a3d13', '#261f0a'];

export default function AssetGraph({ data }: Props) {
  return (
    <div className="h-40 w-full sm:h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
            itemStyle={{ color: '#D4AF37' }}
            formatter={(value: number) => [`${value}%`, 'Share']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
