
import { useState, useEffect } from "react";
import { Loader2, BookOpen, Star, Award, Users } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { getCourses } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      // Usar getCourses que agora já verifica internamente se o usuário está autenticado
      const data = await getCourses();
      setCourses(data || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 bg-[size:50px_50px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-block animate-float mb-2">
              <div className="flex items-center justify-center bg-primary/10 rounded-full p-2">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold animate-fade-in opacity-0">
              Curso<span className="text-primary">Galaxy</span>
            </h1>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto animate-slide-up opacity-0">
              Sua plataforma para aprendizado rápido e prático. Adquira habilidades em demanda com nossos cursos curtos e focados.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-in opacity-0" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" asChild>
                <a href="#courses">Explorar Cursos</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                {isAuthenticated ? (
                  <a href="/wallet">Adicionar Fundos</a>
                ) : (
                  <a href="/register">Criar Conta</a>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 rounded-lg bg-muted backdrop-blur-sm animate-slide-up opacity-0 stagger-item">
              <div className="bg-primary/20 p-3 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">100+</h3>
              <p className="text-muted-foreground text-center">Cursos Disponíveis</p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-lg bg-muted backdrop-blur-sm animate-slide-up opacity-0 stagger-item">
              <div className="bg-primary/20 p-3 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">10,000+</h3>
              <p className="text-muted-foreground text-center">Alunos Ativos</p>
            </div>
            <div className="flex flex-col items-center p-6 rounded-lg bg-muted backdrop-blur-sm animate-slide-up opacity-0 stagger-item">
              <div className="bg-primary/20 p-3 rounded-full mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">4.8</h3>
              <p className="text-muted-foreground text-center">Avaliação Média</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Cursos em Destaque</h2>
            <p className="text-muted-foreground mt-2">
              Explore nossa seleção de cursos curtos e objetivos
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <Award className="h-16 w-16 mx-auto text-muted" />
              <h3 className="mt-4 text-xl font-bold">No courses available</h3>
              <p className="mt-2 text-muted-foreground">
                Courses will be available soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <div key={course.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <CourseCard course={course} onUpdated={loadCourses} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-secondary to-primary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-muted/20 backdrop-blur-sm p-8 md:p-12 rounded-lg border border-primary/20 animate-fade-in opacity-0">
            <div className="md:flex md:items-center md:justify-between">
              <div className="mb-6 md:mb-0 md:w-2/3">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Pronto para aumentar suas habilidades?
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Junte-se a milhares de estudantes e profissionais que estão ampliando seus conhecimentos com nossos cursos.
                </p>
              </div>
              <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-3">
                <Button size="lg" asChild>
                  <a href={isAuthenticated ? "#courses" : "/register"}>
                    {isAuthenticated ? "Ver cursos" : "Criar uma conta"}
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href={isAuthenticated ? "/wallet" : "/login"}>
                    {isAuthenticated ? "Adicionar fundos" : "Fazer login"}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
