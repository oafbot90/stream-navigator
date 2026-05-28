import React from 'react';
import Layout from '@/components/Layout';
import ThemeSelector from '@/components/ThemeSelector';
import { Palette } from 'lucide-react';

const Themes: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pt-28 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Personalizar Tema</h1>
        </div>
        <p className="text-muted-foreground mb-8">Escolha o visual que combina com você</p>
        <ThemeSelector />
      </div>
    </Layout>
  );
};

export default Themes;
