async function fetchQuestion() {
    setLoading(true);
    setAnswer(null);
    setCorrect(null);
    setTimer(0);
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*, topics(name_ru)")
        .eq("is_active", true)
        .limit(50);

      if (error) throw error;
      if (data && data.length > 0) {
        const available = data.filter(q => !answered.includes(q.id));
        const pool = available.length > 0 ? available : data;
        const random = pool[Math.floor(Math.random() * pool.length)];
        setQuestion(random);
      } else {
        setQuestion(null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }