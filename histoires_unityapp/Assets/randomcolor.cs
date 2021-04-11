using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class randomcolor : MonoBehaviour
{
    static Object[] colours;// = new List<Material>();
    static bool loaded = false;
    // Start is called before the first frame update
    static void Start()
    {
        
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public static Material GetRandomMaterial()
    {
        if (!loaded)
        {
            colours = Resources.LoadAll("materials", typeof(Material));
            loaded = true;
            Debug.Log("colors loaded!");
            Debug.Log(colours.Length);
            Debug.Log(colours[0]);
        }
        
        int pick = Random.Range(0, colours.Length);
        Debug.Log("picked color " + pick);
        return (Material)colours[pick];
    }
}
