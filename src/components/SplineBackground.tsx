import Spline from '@splinetool/react-spline';

export default function SplineBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Spline scene="https://prod.spline.design/Ka4ej4BEVPr6wOFu/scene.splinecode" />
    </div>
  );
}
